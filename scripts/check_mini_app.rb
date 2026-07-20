#!/usr/bin/env ruby
# frozen_string_literal: true

# Presence / shape check for the Taro WeChat mini-app.
# Full `taro build` remains a separate (often DevTools-bound) gate.
# Usage: ruby scripts/check_mini_app.rb [DIR]
# Defaults DIR to mini-app under PRODUCT_ROOT or cwd.

require "json"
require "pathname"

dir = ARGV.shift
root = Pathname(ENV["PRODUCT_ROOT"] || Dir.pwd).expand_path
app = Pathname(dir || "mini-app")
app = root.join(app) unless app.absolute?

abort "mini-app directory missing: #{app}" unless app.directory?

required_files = %w[
  package.json
  project.config.json
  tsconfig.json
  babel.config.js
  config/index.ts
  src/app.ts
  src/app.config.ts
  src/services/request.ts
  src/services/auth.ts
  src/services/trips.ts
  src/stores/user.ts
  src/pages/login/index.tsx
  src/pages/index/index.tsx
  src/pages/map/index.tsx
  src/pages/list/index.tsx
  src/pages/detail/index.tsx
  src/pages/publish-driver/index.tsx
  src/pages/publish-passenger/index.tsx
  src/pages/mine/index.tsx
  src/pages/feedback/index.tsx
]
missing = required_files.map { |f| app.join(f) }.reject(&:file?)
abort "missing mini-app files under #{app}:\n  - #{missing.map { |p| p.relative_path_from(app) }.join("\n  - ")}" unless missing.empty?

pkg = JSON.parse(app.join("package.json").read)
name = pkg["name"].to_s
abort "mini-app package.json name expected @egofind/mini-app, got #{name.inspect}" unless name == "@egofind/mini-app"

cfg = JSON.parse(app.join("project.config.json").read)
abort "mini-app project.config.json missing appid" if cfg["appid"].to_s.strip.empty?

app_config = app.join("src/app.config.ts").read
%w[pages/login/index pages/map/index pages/publish-driver/index pages/publish-passenger/index].each do |page|
  abort "mini-app app.config.ts missing page #{page}" unless app_config.include?(page)
end

puts "mini-app checks passed (#{app})"
