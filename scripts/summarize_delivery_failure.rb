#!/usr/bin/env ruby
# frozen_string_literal: true
# Summarize the latest failed delivery run for Fix-to-Green repair.
#
# Usage:
#   ruby scripts/summarize_delivery_failure.rb [TASK_OR_RUN_DIR]
#
# Inputs (first match wins for run dir):
#   1. CLI arg that is an existing directory (DELIVERY_RUN_DIR style)
#   2. ENV DELIVERY_RUN_DIR
#   3. CLI task name / id → latest run under product.yaml delivery.evidence_root
#   4. ENV DELIVERY_TASK → task file basename / id → latest run
#
# Exit: 0 when a summary was printed (pass or fail); 1 when no run/report found.

require "pathname"
require "yaml"

PRODUCT_ROOT = Pathname(ENV.fetch("PRODUCT_ROOT", Pathname(__dir__).parent)).expand_path
SCOPE_HINTS = {
  "workflow" => { scope: "workflow", paths: ["tasks/", "issues/", "docs/"] },
  "backend-test" => { scope: "backend", paths: ["backend/"] },
  "backend-prisma" => { scope: "backend", paths: ["backend/prisma/"] },
  "backend-health" => { scope: "backend", paths: ["backend/src/", "backend/dist/"] },
  "admin-presence" => { scope: "admin-web", paths: ["admin-web/"] },
  "admin-build" => { scope: "admin-web", paths: ["admin-web/"] },
  "admin-health" => { scope: "admin-web", paths: ["admin-web/dist/"] },
  "miniprogram-presence" => { scope: "mini-app", paths: ["mini-app/"] },
}.freeze

def load_product
  path = PRODUCT_ROOT.join("product.yaml")
  abort "missing product.yaml at #{path}" unless path.file?

  YAML.safe_load(path.read, aliases: false) || {}
end

def evidence_root(product)
  raw = product.dig("delivery", "evidence_root") || "/tmp/agent-delivery/#{product['name'] || 'product'}"
  Pathname(raw).expand_path
end

def task_id_from_name(name)
  return nil if name.nil? || name.to_s.strip.empty?

  direct = PRODUCT_ROOT.join("tasks", "#{name}.md")
  if direct.file?
    fm = direct.read[/\A---\n(.*?)\n---/m, 1]
    id = fm&.[](/^id:\s*["']?(.+?)["']?\s*$/, 1)
    return id.strip if id
    return name.to_s
  end

  Dir[PRODUCT_ROOT.join("tasks", "*.md")].each do |path|
    next if File.basename(path) == "template.md"

    body = File.read(path)
    id = body[/\A---\n(.*?)\n---/m, 1]&.[](/^id:\s*["']?(.+?)["']?\s*$/, 1)&.strip
    title = body[/\A---\n(.*?)\n---/m, 1]&.[](/^title:\s*["']?(.+?)["']?\s*$/, 1)&.strip
    return id if id && (id == name || title == name || File.basename(path, ".md") == name)
  end

  name.to_s
end

def latest_run_dir(root, task_id)
  base = root.join(task_id.to_s)
  return nil unless base.directory?

  base.children.select(&:directory?).max_by { |p| p.mtime }
end

def resolve_run_dir(arg, product)
  candidates = []
  candidates << Pathname(arg).expand_path if arg && !arg.to_s.empty?
  candidates << Pathname(ENV["DELIVERY_RUN_DIR"]).expand_path if ENV["DELIVERY_RUN_DIR"] && !ENV["DELIVERY_RUN_DIR"].empty?

  candidates.each do |path|
    return path if path.directory?
  end

  task_hint = arg
  if task_hint.nil? || task_hint.to_s.empty?
    task_env = ENV["DELIVERY_TASK"].to_s
    task_hint = File.basename(task_env, ".md") unless task_env.empty?
  end

  abort "usage: ruby scripts/summarize_delivery_failure.rb [TASK_OR_RUN_DIR]\n" \
        "   or set DELIVERY_RUN_DIR / DELIVERY_TASK" if task_hint.nil? || task_hint.to_s.empty?

  # If arg was a non-dir path that looks like a run dir, fail clearly
  if arg && Pathname(arg).expand_path.exist? && !Pathname(arg).expand_path.directory?
    abort "not a delivery run directory: #{arg}"
  end

  tid = task_id_from_name(task_hint)
  run = latest_run_dir(evidence_root(product), tid)
  abort "no delivery runs under #{evidence_root(product).join(tid)}" unless run

  run
end

def parse_report(report_path)
  text = report_path.read
  status = text[/^- Status:\s*(.+)$/, 1]&.strip
  failures = []
  current_round = nil

  text.each_line do |line|
    if (m = line.match(/^### Round\s+(\d+)/))
      current_round = m[1].to_i
      next
    end
    if (m = line.match(/^- \[FAIL\] `([^`]+)`:\s*`([^`]*)`/))
      failures << {
        round: current_round,
        label: m[1],
        command: m[2],
        log: nil,
      }
      next
    end
    if failures.any? && (m = line.match(/^\s+Log:\s*`([^`]+)`/))
      failures.last[:log] = m[1] if failures.last[:log].nil?
    end
  end

  { status: status, failures: failures, raw: text }
end

def check_id_from_label(label)
  # Labels are often the check id, sometimes with suffixes (service start, health).
  base = label.to_s.split("/").first
  SCOPE_HINTS.keys.find { |id| base == id || base.start_with?("#{id}-") || base.include?(id) } || base
end

def hint_for(label)
  id = check_id_from_label(label)
  SCOPE_HINTS[id] || { scope: "unknown", paths: [] }
end

def tail_file(path, lines: 40)
  p = Pathname(path)
  return "(log missing: #{path})" unless p.file?

  content = p.read
  content.lines.last(lines).join
rescue StandardError => e
  "(could not read log: #{e.message})"
end

product = load_product
arg = ARGV[0]
run_dir = resolve_run_dir(arg, product)
report = run_dir.join("report.md")
abort "missing report.md in #{run_dir}" unless report.file?

parsed = parse_report(report)
max_rounds = Integer(product.dig("delivery", "max_rounds") || 3)

puts "# Delivery failure summary"
puts
puts "- Run dir: `#{run_dir}`"
puts "- Report: `#{report}`"
puts "- Status: #{parsed[:status] || 'unknown'}"
puts "- product.yaml max_rounds: #{max_rounds}"
puts
puts "## Fix-to-Green actions"
puts
puts "1. Repair only scopes listed below (minimal diff)."
puts "2. Re-run: `ruby scripts/deliver.rb <task>`"
puts "3. Repeat until green or #{max_rounds} session rounds; hard-stop on human gates / missing env."
puts "4. Do not invent pass for wechat-devtools, production-deploy, or api-smoke-with-infra."
puts

if parsed[:failures].empty?
  puts "## Failures"
  puts
  puts "_No `[FAIL]` lines in report.md (run may have passed or report is incomplete)._"
  puts
  puts "### Report excerpt"
  puts
  puts "```"
  puts parsed[:raw].lines.first(40).join
  puts "```"
  exit 0
end

puts "## Failed checks (#{parsed[:failures].length})"
puts

parsed[:failures].each_with_index do |f, i|
  hint = hint_for(f[:label])
  puts "### #{i + 1}. `#{f[:label]}`"
  puts
  puts "- Round: #{f[:round] || '?'}"
  puts "- Command: `#{f[:command]}`"
  puts "- Suggested scope: **#{hint[:scope]}**"
  puts "- Touch paths: #{hint[:paths].empty? ? '_infer from log_' : hint[:paths].map { |p| "`#{p}`" }.join(', ')}"
  puts "- Log: `#{f[:log]}`" if f[:log]
  puts
  if f[:log]
    puts "<details><summary>Log tail</summary>"
    puts
    puts "```"
    puts tail_file(f[:log])
    puts "```"
    puts
    puts "</details>"
    puts
  end
end

scopes = parsed[:failures].map { |f| hint_for(f[:label])[:scope] }.uniq
puts "## Scope order for this repair"
puts
scopes.each { |s| puts "- #{s}" }
puts
puts "_Unattended runner repair (DELIVERY_REPAIR_COMMAND) is a follow-up; session Agent is the repair owner._"

exit 0
