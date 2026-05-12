const fs = require('fs');

function parseLine(line) {
  try {
    // The file seems to have multiple JSON objects, but not in a standard array
    // Each object starts with { and ends with }
    // Let's try to fix the input if it's not a valid array
    return JSON.parse(line);
  } catch (e) {
    return null;
  }
}

// Since the file is large and formatted with multiple lines per object,
// we need a smarter way to read it.
// Actually, it looks like it's a mongodump style or just pretty-printed objects one after another.

const content = fs.readFileSync('menuitems.json', 'utf8');
const objects = [];
let currentObjectString = '';
let depth = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') {
    depth++;
  }
  currentObjectString += char;
  if (char === '}') {
    depth--;
    if (depth === 0) {
      try {
        objects.push(JSON.parse(currentObjectString));
      } catch (e) {
        // console.error('Failed to parse object', e);
      }
      currentObjectString = '';
    }
  }
}

console.log(`Read ${objects.length} objects`);

const nameToId = {};
objects.forEach(obj => {
  if (obj.name && obj._id && obj._id.$oid) {
    nameToId[obj.name.toLowerCase().trim()] = obj._id.$oid;
  }
});

fs.writeFileSync('name_to_id.json', JSON.stringify(nameToId, null, 2));
console.log('Saved name_to_id.json');
