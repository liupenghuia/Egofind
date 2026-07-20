#!/usr/bin/env ruby
# frozen_string_literal: true

# Presence / shape check for the Vite + React admin app.
# Usage: ruby scripts/check_admin_web.rb [DIR]
# Defaults DIR to admin-web under PRODUCT_ROOT or cwd.

require "json"
require "pathname"

dir = ARGV.shift
root = Pathname(ENV["PRODUCT_ROOT"] || Dir.pwd).expand_path
web = Pathname(dir || "admin-web")
web = root.join(web) unless web.absolute?

abort "admin-web directory missing: #{web}" unless web.directory?

required_files = %w[
  package.json
  index.html
  vite.config.ts
  src/main.tsx
  src/App.tsx
  src/pages/Login.tsx
  src/pages/Dashboard.tsx
  src/api/request.ts
]
missing = required_files.map { |f| web.join(f) }.reject(&:file?)
abort "missing admin-web files under #{web}:\n  - #{missing.map { |p| p.relative_path_from(web) }.join("\n  - ")}" unless missing.empty?

pkg = JSON.parse(web.join("package.json").read)
name = pkg["name"].to_s
abort "admin-web package.json name expected @egofind/admin-web, got #{name.inspect}" unless name == "@egofind/admin-web"

html = web.join("index.html").read
abort "#{web}/index.html missing #root mount" unless html.include?('id="root"') || html.include?("id='root'")
abort "#{web}/index.html missing src/main.tsx entry" unless html.include?("src/main.tsx") || html.include?("/src/main.tsx")

puts "admin-web checks passed (#{web})"
