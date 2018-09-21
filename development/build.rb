#!/usr/bin/env ruby
require 'pp'
require 'fileutils'

BUILD_ENV = ARGV[0]
VERSION_FILE = 'src/VERSION'
BACKEND_VERSION_FILE = '../main/VERSION'
SOURCE_DIR = 'src/modules'
TARGET_DIR = BUILD_ENV == 'dev' ? 'tmp/development/public' : '../homepage/public_html/modules'
RELEASE_COMMAND = '../homepage/bin/release'

version = File.read(VERSION_FILE).strip

if BUILD_ENV == 'dev'
  # Increment the last number in the version
  prev_version = version
  core, pre = prev_version.split('-')
  pre_items = pre.split('.')
  last = pre_items.pop
  last = (last&.to_i || 0) + 1
  pre_items << last
  version = [core, pre_items.join('.')].join('-')
  puts "Version: #{version}"
  File.open(VERSION_FILE, 'w') { |f| f.puts version }
  File.open(BACKEND_VERSION_FILE, 'w') { |f| f.puts version }
end

# Process files & write to target dir
FileUtils.mkdir_p(TARGET_DIR)
Dir["#{SOURCE_DIR}/*"].each do |fn|
  dir  = File.dirname(fn)
  base = File.basename(fn, ".*")
  ext  = File.extname(fn)

  next if ext != '.js' && ext != '.css'

  target_fn = "#{TARGET_DIR}/memonite-#{base}-v#{version}#{ext}"

  puts "Process: #{fn} -> #{target_fn}"

  if ext == '.js'
    cmd = "./development/build-file.rb #{fn} #{version} > #{target_fn}"
    puts `#{cmd}`
  else
    content = File.read(fn)
    content.gsub!('{{VERSION}}', version)
    File.open(target_fn, 'w') do |f|
      f.write(content)
    end
  end
end

if BUILD_ENV == 'prod'
  puts `#{RELEASE_COMMAND}`
end
