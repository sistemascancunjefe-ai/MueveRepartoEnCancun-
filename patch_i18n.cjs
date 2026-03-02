const fs = require('fs');

const path = 'src/utils/i18n.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /return ui\[lang\]\[key\] !== undefined \? ui\[lang\]\[key\] : ui\[defaultLang\]\[key\];/g,
    `return ui[lang].hasOwnProperty(key) && ui[lang][key] !== undefined ? ui[lang][key] : ui[defaultLang][key];`
);

fs.writeFileSync(path, content, 'utf8');
