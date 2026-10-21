# Idempotently wires local plugins, entitlements and the WidgetKit extension into App.xcodeproj (run on macOS CI).
require 'xcodeproj'
proj = Xcodeproj::Project.open(File.join(__dir__, '..', 'App.xcodeproj'))
app = proj.targets.find { |t| t.name == 'App' }
grp = proj.main_group['App']
%w[MLBridgeViewController.swift MLWidgetPlugin.swift MLShared.swift].each do |f|
  next if grp.files.any? { |x| x.path == f }
  app.add_file_references([grp.new_file(f)])
end
grp.new_file('App.entitlements') unless grp.files.any? { |x| x.path == 'App.entitlements' }
app.build_configurations.each do |c|
  s = c.build_settings
  s['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
  s['CODE_SIGN_STYLE'] = 'Manual'; s['DEVELOPMENT_TEAM'] = '3S2B5CZC84'
  s['PROVISIONING_PROFILE_SPECIFIER'] = ENV.fetch('APP_PROFILE'); s['CODE_SIGN_IDENTITY[sdk=iphoneos*]'] = 'Apple Distribution'
end
unless proj.targets.any? { |t| t.name == 'MossloopWidget' }
  w = proj.new_target(:app_extension, 'MossloopWidget', :ios, '15.0')
  wg = proj.main_group.new_group('MossloopWidget', 'MossloopWidget')
  w.add_file_references([wg.new_file('MossloopWidget.swift'), wg.new_file('MLShared.swift')])
  wg.new_file('Info.plist'); wg.new_file('MossloopWidget.entitlements')
  w.build_configurations.each do |c|
    s = c.build_settings
    s.merge!('PRODUCT_BUNDLE_IDENTIFIER' => 'com.baroodlabs.mossloop.widget', 'INFOPLIST_FILE' => 'MossloopWidget/Info.plist', 'CODE_SIGN_ENTITLEMENTS' => 'MossloopWidget/MossloopWidget.entitlements',
      'SWIFT_VERSION' => '5.0', 'TARGETED_DEVICE_FAMILY' => '1', 'DEVELOPMENT_TEAM' => '3S2B5CZC84', 'CODE_SIGN_STYLE' => 'Manual', 'PROVISIONING_PROFILE_SPECIFIER' => ENV.fetch('WIDGET_PROFILE'), 'CODE_SIGN_IDENTITY[sdk=iphoneos*]' => 'Apple Distribution', 'MARKETING_VERSION' => '1.0',
      'CURRENT_PROJECT_VERSION' => '1', 'GENERATE_INFOPLIST_FILE' => 'NO', 'SKIP_INSTALL' => 'YES', 'PRODUCT_NAME' => 'MossloopWidget', 'IPHONEOS_DEPLOYMENT_TARGET' => '15.0',
      'LD_RUNPATH_SEARCH_PATHS' => '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks')
  end
  w.add_system_framework('WidgetKit'); w.add_system_framework('SwiftUI')
  app.add_dependency(w)
  ph = app.new_copy_files_build_phase('Embed Foundation Extensions'); ph.symbol_dst_subfolder_spec = :plug_ins
  bf = ph.add_file_reference(w.product_reference, true); bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
end
proj.save
puts 'native wiring ok'
