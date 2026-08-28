import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { getAllRsvps } from "@/lib/db";
import { HOST_SESSION_COOKIE, verifySessionToken } from "@/lib/hostAuth";

export const dynamic = "force-dynamic";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 20, marginBottom: 4, color: "#8a3b4f" },
  subtitle: { fontSize: 11, marginBottom: 16, color: "#555555" },
  table: { display: "flex", flexDirection: "column", borderWidth: 1, borderColor: "#dddddd" },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f7ddd4",
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
  },
  headerCell: { padding: 6, fontSize: 11, fontWeight: 700 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  cell: { padding: 6, fontSize: 10 },
  cellName: { flex: 2 },
  cellAttending: { flex: 1 },
  cellDate: { flex: 2 },
  empty: { padding: 12, fontSize: 10, color: "#777777" },
});

// Requires an already-valid session cookie — the PDF data is never handed
// to the client before this check passes (same guard as /host itself).
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(HOST_SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Access denied." }, { status: 401 });
  }

  const rsvps = await getAllRsvps();
  const attendingCount = rsvps.filter((r) => r.attending).length;
  const notAttendingCount = rsvps.length - attendingCount;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>RSVP List</Text>
        <Text style={styles.subtitle}>
          {attendingCount} attending · {notAttendingCount} not attending · {rsvps.length} total
        </Text>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.cellName]}>Name</Text>
            <Text style={[styles.headerCell, styles.cellAttending]}>Attending</Text>
          </View>
          {rsvps.map((r) => (
            <View style={styles.row} key={r.id}>
              <Text style={[styles.cell, styles.cellName]}>{r.name}</Text>
              <Text style={[styles.cell, styles.cellAttending]}>{r.attending ? "Yes" : "No"}</Text>
            </View>
          ))}
          {rsvps.length === 0 && <Text style={styles.empty}>No RSVPs yet.</Text>}
        </View>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  const filename = `rsvp-list-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(new Blob([Uint8Array.from(buffer)], { type: "application/pdf" }), {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
