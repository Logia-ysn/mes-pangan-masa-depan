const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'types', 'api');
const files = ['T_getWorkOrders.ts', 'T_createWorkOrder.ts', 'T_updateWorkOrder.ts', 'T_deleteWorkOrder.ts', 'T_getWorkOrderById.ts', 'T_workOrderWorkflow.ts', 'T_workOrderWorksheet.ts'];

files.forEach(f => {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) {
        let code = fs.readFileSync(p, 'utf8');
        const regex = /export const [a-zA-Z0-9_]+_meta = \{[\s\S]*?method:\s*'([^']+)'(?: as const)?(?:,|\r|\n)[\s\S]*?url:\s*'([^']+)'(?:,|\r|\n)[\s\S]*?\}/m;
        const match = code.match(regex);
        if (match) {
            const method = match[1];
            const url = match[2];
            const aliasStr = f.replace('.ts', '');
            const aliasStrLower = aliasStr.charAt(0).toLowerCase() + aliasStr.slice(1);
            console.log(`Fixing ${f}: method=${method}, url=${url}, alias=${aliasStrLower}`);

            const replacement = `export const method = '${method}';\nexport const url_path = '${url}';\nexport const alias = '${aliasStrLower}';`;
            code = code.replace(regex, replacement);
            fs.writeFileSync(p, code);
        } else {
            console.log(`No meta block found in ${f}`);
        }
    }
});
