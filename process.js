const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path")
const PDFDocument = require("pdfkit");

function createPdf(title, chapters) {
  console.log("CREATING PDF");

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(path.join("output", `${title}.pdf`)));
  const chapterNumberRegex = /chapter-([0-9]+)/;
  const chapterNameRegex = /chapter-(.+)/;
  Object.keys(chapters).sort((a, b) => {
    const aNumMatch = chapterNumberRegex.exec(a);
    const bNumMatch = chapterNumberRegex.exec(b);
    if (!aNumMatch && bNumMatch) {
      return -1;
    } else if (aNumMatch && !bNumMatch) {
      return 1;
    } else if (!aNumMatch && !bNumMatch) {
      return a.localeCompare(b);
    } else {
      return Number(aNumMatch[1]) - Number(bNumMatch[1]);
    }
  }).forEach((chapter, idx) => {
    const contents = chapters[chapter];
    const chapterNameMatch = chapterNameRegex.exec(chapter);
    const chapterTitle = chapterNameMatch ? `Chapter ${chapterNameMatch[1]}` : chapter;
    if (idx !== 0) doc.addPage();
    doc.fontSize(18).text("__________________\n\n");
    doc.fontSize(18).text(chapterTitle);
    doc.fontSize(18).text("__________________\n\n");
    doc.fontSize(12).text(contents);
  });
  doc.end();
  
  console.log("DONE");
}

function scrape(title, basePath) {
  console.log("READING FILES");

  const chapters = {};
  const filenames = fs.readdirSync(basePath);
  // const multiNewlineRegex = /\n\s*\n/g;
  filenames.map(filename => {
    return fs.readFile(path.join(basePath, filename), (err, content) => {
      if (err) return console.log(`Could not read file ${filename}: ${err}`);
      const { document } = new JSDOM(content).window;
      const unneededText = document.querySelector("#growfoodsmart");
      if (unneededText) unneededText.remove();
      const ads = document.querySelectorAll(".desc center");
      ads.forEach(ad => ad.remove());
      const chapterContent = document.querySelector(".desc").textContent;
      chapters[filename] = chapterContent.trim();
      if (Object.keys(chapters).length === filenames.length) createPdf(title, chapters);
    });
  });
}

scrape(process.argv[2], process.argv[3]);

