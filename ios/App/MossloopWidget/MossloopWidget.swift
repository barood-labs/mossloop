import WidgetKit
import SwiftUI

// Shows today's 3 "Rediscover" items. Data comes from the app through a device-only shared keychain item (MLShared).
struct WData: Codable { var title: String; var items: [String]; var theme: String }
struct Entry: TimelineEntry { let date: Date; let d: WData }
struct Provider: TimelineProvider {
    let ph = WData(title: "Mossloop", items: [], theme: "leaf")
    func load() -> WData { guard let s = MLShared.read(), let d = s.data(using: .utf8), let w = try? JSONDecoder().decode(WData.self, from: d) else { return ph }; return w }
    func placeholder(in c: Context) -> Entry { Entry(date: Date(), d: ph) }
    func getSnapshot(in c: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: Date(), d: load())) }
    func getTimeline(in c: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        completion(Timeline(entries: [Entry(date: Date(), d: load())], policy: .after(Date().addingTimeInterval(3600)))) }
}
struct WView: View {
    let e: Entry
    var bg: Color { e.d.theme == "sand" ? Color(red: 0.95, green: 0.86, blue: 0.62) : e.d.theme == "night" ? Color(red: 0.1, green: 0.14, blue: 0.17) : Color(red: 0.18, green: 0.42, blue: 0.29) }
    var fg: Color { e.d.theme == "sand" ? Color(red: 0.17, green: 0.13, blue: 0.03) : .white }
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(e.d.title).font(.headline).lineLimit(1)
            if e.d.items.isEmpty { Text("✓").font(.title2) }
            ForEach(Array(e.d.items.prefix(3).enumerated()), id: \.offset) { _, t in Text("• " + t).font(.caption).lineLimit(1) }
            Spacer(minLength: 0)
        }.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading).foregroundColor(fg).widgetBackground(bg)
    }
}
extension View {
    @ViewBuilder func widgetBackground(_ c: Color) -> some View {
        if #available(iOSApplicationExtension 17.0, *) { self.containerBackground(c, for: .widget) } else { self.padding().background(c) }
    }
}
@main struct MossloopWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MossloopWidget", provider: Provider()) { WView(e: $0) }
            .configurationDisplayName("Mossloop").description("Today's 3 things to rediscover.").supportedFamilies([.systemSmall, .systemMedium])
    }
}
