const {createCanvas,loadImage} = require('canvas');
const cheerio = require('cheerio');
const { writeFileSync } = require('fs');
const org = `htop`
const url = `https://hcb.hackclub.com/${org}/ledger?action=transactions&controller=events&event_id=${org}&type=donation`


;(async () => {
const $ = await cheerio.load(await (await fetch(url)).text())
writeFileSync(`./out_a.html`, $.html())
// console.log($.text())
const api_data = await fetch(`https://hcb.hackclub.com/api/v3/organizations/${org}/donations`).then(r=>r.json())


const IMAGE_SIZE = 64;
const IMAGES_PER_ROW = 20;
async function generateGraph(images) {
const imageCount = images.length;
const width = IMAGE_SIZE * IMAGES_PER_ROW;
const rowCount = (imageCount / IMAGES_PER_ROW) * IMAGE_SIZE;
const height = Math.ceil(rowCount / IMAGE_SIZE) * IMAGE_SIZE;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

let col = 0;
let row = 0;
for (const img of images) {
    // ctx.drawImage(img, col * IMAGE_SIZE, row * IMAGE_SIZE, IMAGE_SIZE, IMAGE_SIZE);
    const padding = 4; // adjust as needed
    const size = IMAGE_SIZE - padding * 2;
    const x = col * IMAGE_SIZE + padding;
    const y = row * IMAGE_SIZE + padding;
    
    ctx.save(); // Save the canvas state
    
    // Create a circular clipping path
    ctx.beginPath();
    ctx.arc(
      x + size / 2,  
      y + size / 2,  
      size / 2,      
      0,
      Math.PI * 2
    );
    ctx.clip();
    
    // Draw the image within the circular clipping area
    ctx.drawImage(img, x, y, size, size);
    
    ctx.restore(); 

    if (++col === IMAGES_PER_ROW) {
        col = 0;
        row++;
    }
}

return canvas.toBuffer();
}

const all_links = []
// console.log("Generating graph for " + login);
const imgs = await Promise.all(api_data.map(async (d) => {
    const id = d.transaction.id;
    const el =  $(`#${id.split('txn_')[1]}`);
    if(!el.html()) return;
    let imgLink = el.find('img').attr('src');
    if(!imgLink) imgLink = "https://hc-cdn.hel1.your-objectstorage.com/s/v3/b0fc00468ea0b82652efa59b0845e41bb042a03e_image-removebg-preview.png";
    if(all_links.includes(imgLink) && imgLink !== "https://hc-cdn.hel1.your-objectstorage.com/s/v3/b0fc00468ea0b82652efa59b0845e41bb042a03e_image-removebg-preview.png") return;
    all_links.push(imgLink)
    return await (await fetch(imgLink)).arrayBuffer().then(d=>loadImage(Buffer.from(d)));
})).then(d=>d.filter(Boolean));
const graph = await generateGraph(imgs);
writeFileSync(`example.png`, graph);
console.log("Done! Graph written to ");
})()