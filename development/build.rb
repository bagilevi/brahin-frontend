#!/usr/bin/env ruby
require 'pp'
require 'fileutils'

VERSION_FILE = 'src/VERSION'
BACKEND_VERSION_FILE = '../main/VERSION'
SOURCE_DIR = 'src/modules'
TARGET_DIR = 'tmp/development/public'

# Increment the last number in the version
prev_version = File.read(VERSION_FILE).strip
core, pre = prev_version.split('-')
pre_items = pre.split('.')
last = pre_items.pop
last = (last&.to_i || 0) + 1
pre_items << last
version = [core, pre_items.join('.')].join('-')
puts "Version: #{version}"
File.open(VERSION_FILE, 'w') { |f| f.puts version }
File.open(BACKEND_VERSION_FILE, 'w') { |f| f.puts version }

# Copy files
FileUtils.mkdir_p(TARGET_DIR)
Dir["#{SOURCE_DIR}/*"].each do |fn|
  dir  = File.dirname(fn)
  base = File.basename(fn, ".*")
  ext  = File.extname(fn)

  target_fn = "#{TARGET_DIR}/memonite-#{base}-v#{version}#{ext}"

  puts "Process: #{fn} -> #{target_fn}"
  content = File.read(fn)
  content.gsub!('{{VERSION}}', version)
  File.open(target_fn, 'w') do |f|
    f.write(content)
  end
end
