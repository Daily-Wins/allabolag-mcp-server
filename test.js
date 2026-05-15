// Test script för att verifiera Allabolag MCP Server
// Detta är inte en komplett MCP-test men visar hur funktionerna kan användas

import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function testSearch() {
  console.log("Testing search...");
  try {
    const response = await fetch("https://www.allabolag.se/what/Spotify", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log("Page title:", $("title").text());
    console.log("Search results found:", $(".search-hit").length);
    console.log("✓ Search test completed");
  } catch (error) {
    console.error("✗ Search test failed:", error);
  }
}

async function testCompanyPage() {
  console.log("\nTesting company page...");
  try {
    // Spotify's org number
    const response = await fetch("https://www.allabolag.se/5567037485", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log("Company name:", $("h1").first().text().trim());
    console.log("Found fact rows:", $(".company-facts tr").length);
    console.log("✓ Company page test completed");
  } catch (error) {
    console.error("✗ Company page test failed:", error);
  }
}

async function runTests() {
  console.log("=== Allabolag MCP Server Tests ===\n");
  await testSearch();
  await testCompanyPage();
  console.log("\n=== Tests completed ===");
}

runTests();
