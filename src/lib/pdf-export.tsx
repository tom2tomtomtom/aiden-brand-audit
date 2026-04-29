import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { AuditResults } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#050505",
    padding: 40,
    fontFamily: "Helvetica",
    color: "#ffffff",
  },
  header: {
    borderBottom: "3px solid #ff2e2e",
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff2e2e",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b00",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 24,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: 6,
  },
  text: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 1.6,
    marginBottom: 6,
  },
  boldText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  findingRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  findingNumber: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ff2e2e",
    width: 24,
    fontFamily: "Courier",
  },
  findingText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    flex: 1,
    lineHeight: 1.5,
  },
  brandCard: {
    backgroundColor: "#0f0f0f",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: 12,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff2e2e",
    fontFamily: "Courier",
  },
  statLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  colorRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 6,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  actionCard: {
    backgroundColor: "#0f0f0f",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: 10,
    marginBottom: 6,
    flexDirection: "row",
    gap: 10,
  },
  actionNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff2e2e",
    fontFamily: "Courier",
    width: 28,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: "2px solid #ff2e2e",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

export function BrandDNAReport({ results }: { results: AuditResults }) {
  const analysis = results.strategicAnalysis;
  const brandNames = results.brands.map((b) => b.name).join(" vs ");

  return (
    <Document>
      {/* Page 1: Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Brand DNA Report</Text>
          <Text style={styles.subtitle}>
            {`${brandNames} // ${new Date(results.createdAt).toLocaleDateString()}`}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.text}>{analysis.executiveSummary.overview}</Text>

        <Text style={styles.sectionTitle}>Key Findings</Text>
        {analysis.executiveSummary.keyFindings.map((finding, i) => (
          <View key={i} style={styles.findingRow}>
            <Text style={styles.findingNumber}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={styles.findingText}>{finding}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Strategic Implications</Text>
        <Text style={styles.text}>{analysis.executiveSummary.strategicImplications}</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Brand DNA Analyzer // Powered by AIDEN</Text>
          <Text style={styles.footerText}>Page 1</Text>
        </View>
      </Page>

      {/* Page 2: Brand Overview */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Brands Analyzed</Text>
        {results.brands.map((brand) => (
          <View key={brand.name} style={styles.brandCard}>
            <Text style={styles.brandName}>{brand.name}</Text>
            <Text style={{ ...styles.text, fontSize: 8 }}>{brand.website}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{brand.analytics.totalAds}</Text>
                <Text style={styles.statLabel}>Ads</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{brand.adCreativeUrls.length}</Text>
                <Text style={styles.statLabel}>Images</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{brand.analytics.videoPercent}%</Text>
                <Text style={styles.statLabel}>Video</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{brand.analytics.carouselPercent}%</Text>
                <Text style={styles.statLabel}>Carousel</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{brand.analytics.avgCopyLength}</Text>
                <Text style={styles.statLabel}>Avg Copy</Text>
              </View>
            </View>
            {brand.colors && (
              <View style={styles.colorRow}>
                {[...brand.colors.primaryColors, ...brand.colors.secondaryColors].slice(0, 6).map((color, i) => (
                  <View key={i} style={{ ...styles.colorSwatch, backgroundColor: color }} />
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Brand DNA Analyzer // Powered by AIDEN</Text>
          <Text style={styles.footerText}>Page 2</Text>
        </View>
      </Page>

      {/* Page 3: Strategic Synthesis */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Competitive Positioning</Text>
        {Object.entries(analysis.strategicSynthesis.competitivePositioning).map(([brand, data]) => {
          const pos = data as { strengths: string[]; weaknesses: string[]; marketPosition: string };
          return (
            <View key={brand} style={styles.brandCard}>
              <Text style={styles.brandName}>{brand}</Text>
              <Text style={{ ...styles.text, fontSize: 8, marginBottom: 4 }}>{pos.marketPosition}</Text>
              <Text style={styles.boldText}>Strengths</Text>
              {pos.strengths.map((s, i) => (
                <Text key={i} style={{ ...styles.text, fontSize: 9 }}>+ {s}</Text>
              ))}
              <Text style={{ ...styles.boldText, marginTop: 6 }}>Weaknesses</Text>
              {pos.weaknesses.map((w, i) => (
                <Text key={i} style={{ ...styles.text, fontSize: 9 }}>− {w}</Text>
              ))}
            </View>
          );
        })}

        {analysis.strategicSynthesis.whiteSpaceOpportunities.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>White Space Opportunities</Text>
            {analysis.strategicSynthesis.whiteSpaceOpportunities.map((opp, i) => (
              <View key={i} style={styles.findingRow}>
                <Text style={styles.findingNumber}>{String(i + 1).padStart(2, "0")}</Text>
                <Text style={styles.findingText}>{opp}</Text>
              </View>
            ))}
          </>
        )}

        {analysis.strategicSynthesis.recommendedActions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommended Actions</Text>
            {analysis.strategicSynthesis.recommendedActions.map((rec, i) => (
              <View key={i} style={styles.actionCard}>
                <Text style={styles.actionNumber}>{String(i + 1).padStart(2, "0")}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.boldText}>{rec.action}</Text>
                  <Text style={styles.text}>{rec.rationale}</Text>
                  <Text style={{ ...styles.text, color: "#ff6b00", fontSize: 8 }}>
                    Impact: {rec.expectedImpact}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Brand DNA Analyzer // Powered by AIDEN</Text>
          <Text style={styles.footerText}>Page 3</Text>
        </View>
      </Page>
    </Document>
  );
}
