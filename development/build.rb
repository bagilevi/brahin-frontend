#!/usr/bin/env ruby
require 'pp'
require 'fileutils'
require 'digest'

BUILD_ENV = ARGV[0]
VERSION_FILE = 'src/VERSION'
SOURCE_DIR = 'src/modules'
TARGET_DIR = BUILD_ENV == 'dev' ? 'tmp/development/public' : '../homepage/public_html/modules'
RELEASE_COMMAND = '../homepage/bin/release'
BACKEND_DEV_VERSION_FILE = '../backend/tmp/VERSION'

version = File.read(VERSION_FILE).strip

checksum = Digest::MD5.hexdigest(`find src/modules | xargs shasum`)
version = "#{version}+#{checksum[0..5]}"

File.open(BACKEND_DEV_VERSION_FILE, 'w') { |f| f.puts version }

# Process files & write to target dir
FileUtils.mkdir_p(TARGET_DIR)
Dir["#{SOURCE_DIR}/*"].each do |fn|
  dir  = File.dirname(fn)
  base = File.basename(fn, ".*")
  ext  = File.extname(fn)

  next if ext != '.js' && ext != '.css'
  next if base.end_with?('.test')

  versions = [version]

  if base == 'init'
    stable = !version.include?('-')
    versions << version.split('+').first
    versions << version.sub(/^(\d+)\.(\d+)\.(\d+)\-(.*)/, '\1.\2.\3')
    if stable
      versions << version.sub(/^(\d+)\.(\d+)\.(.*)/, '\1.\2-stable')
      versions << version.sub(/^(\d+)\.(.*)/, '\1-stable')
    else
      versions << version.sub(/^(\d+)\.(\d+)\.(.*)/, '\1.\2-pre')
      versions << version.sub(/^(\d+)\.(.*)/, '\1-pre')
    end
  end

  target_fns = versions.map { |v|  "#{TARGET_DIR}/brahin-#{base}-v#{v}#{ext}" }
  target_fns.each do |target_fn|
    puts "Process: #{fn} -> #{target_fn}"

    if ext == '.js'
      cmd = "./development/build-file.rb #{fn} #{version} > #{target_fn}"
      res = `#{cmd}`
      puts res if res.strip.length > 0
    else
      content = File.read(fn)
      content.gsub!('{{VERSION}}', version)
      File.open(target_fn, 'w') do |f|
        f.write(content)
      end
    end
  end
end

if BUILD_ENV == 'prod'
  puts `#{RELEASE_COMMAND}`
end
