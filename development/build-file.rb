#!/usr/bin/env ruby

# Processes a JavaScript file for production.
# Reads from file specified by the first argument, writes to stdout.
# Converts `require` statements to a requirejs `define`.
# Replaces {{VERSION}} placeholders with the first argument.
#
# Usage (normally used part of the build script ./src/build.rb):
#
#     ./bin/build-file 0.2.194 < src/modules/storage.js > dist/public/brahin-storage-v0.2.194.js
#
# Example input:
#
#     const _ = require('lodash')
#     const PouchDB = require('PouchDB')
#     module.exports = (Brahin) => {
#        // ...
#     }
#
# Example output:
#
#     define(["lodash","PouchDB"], (_, PouchDB) => ((Brahin) => {
#       // ...
#     }))

require 'pp'
require 'fileutils'
require 'json'

INPUT_FILE_PATH, VERSION = ARGV

class Env
  def replace_placeholders(s)
    s.gsub("{{VERSION}}", VERSION)
  end

  def base_path
    File.expand_path(File.dirname(INPUT_FILE_PATH))
  end
end

class FileProcessor
  def initialize(path, env, root: false)
    @path = path
    @env = env
    @root = root
  end

  def output_lines
    process if @output_lines.nil?
    @output_lines
  end

  def name
    @path.sub(@env.base_path, '')
  end

  private

  def process
    lines = File.read(@path).split("\n")
    @imports = [] # e.g. [['lodash', '_'], ['pouchdb', 'PouchDB']]
    @output_lines = []
    @output_end_wrapper = "" # we're going to attach this to the last line

    lines.each do |line|
      if line =~ /^const\s+(.*)\s+=\s+require\('(.*)'\);?$/
        const_name, module_name = $1, $2

        if module_name.start_with?('.')
          module_path = File.expand_path(module_name, File.dirname(@path)) + '.js'
          sub_processor = FileProcessor.new(module_path, @env)
          @output_lines.concat(sub_processor.output_lines)
          @imports << [sub_processor.name, const_name]
        else
          # const _ = require('lodash')   =>   imports << ['lodash', '_']
          @imports << [module_name, const_name]
        end
        next
      end

      if line =~ /^module\.exports = (.*)$/
        line_ending = $1
        module_list = JSON.generate(@imports.map(&:first))
        const_list = @imports.map(&:last).join(', ')
        prefix = "#{JSON.generate(name)}, " if !@root
        @output_lines << "define(#{prefix}#{module_list}, (#{const_list}) => (#{line_ending}"
        @output_end_wrapper << "))"
        next
      end

      @output_lines << @env.replace_placeholders(line)
    end

    @output_lines.last << @output_end_wrapper
  end
end

# lines = File.read(INPUT_FILE_PATH).split("\n")
#
# imports = [] # e.g. [['lodash', '_'], ['pouchdb', 'PouchDB']]
#
# output_lines = []
# output_end_wrapper = "" # we're going to attach this to the last line
#
# lines.each do |line|
#   if line =~ /^const\s+(.*)\s+=\s+require\('(.*)'\);?$/
#     const_name, module_name = $1, $2
#
#     if module_name.start_with?('.')
#       module_path = File.expand_path(module_name, File.dirname(INPUT_FILE_PATH))
#       raise module_path
#     else
#       # const _ = require('lodash')   =>   imports << ['lodash', '_']
#       imports << [module_name, const_name]
#     end
#     next
#   end
#
#   if line =~ /^module\.exports = (.*)$/
#     line_ending = $1
#     module_list = JSON.generate(imports.map(&:first))
#     const_list = imports.map(&:last).join(', ')
#     output_lines << "define(#{module_list}, (#{const_list}) => (#{line_ending}"
#     output_end_wrapper << "))"
#     next
#   end
#
#   output_lines << replace_placeholders(line)
# end
#
# output_lines.last << output_end_wrapper
#

env = Env.new
output_lines = FileProcessor.new(File.expand_path(INPUT_FILE_PATH), env, root: true).output_lines
puts output_lines.join("\n")
