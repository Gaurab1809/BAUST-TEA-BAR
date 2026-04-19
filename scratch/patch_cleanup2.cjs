const fs = require('fs');
const file = 'f:/baust-tea-hub-main/baust-tea-hub-main/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the Orders editing logic:
const ordersRegex = /\{editingOrderTotal\[order\.id\] !== undefined \? \([\s\S]*?\) : \(\s*(<div className="flex items-center gap-2 bg-primary\/10 px-3\.5 py-2 rounded-xl border border-primary\/20 shadow-sm hover:bg-primary\/20 transition-colors">[\s\S]*?<span className="font-black text-sm text-primary tracking-tight">৳\{order\.total\}<\/span>[\s\S]*?<\/div>)\s*\)\}/;
content = content.replace(ordersRegex, (match, divBlock) => {
    // We captured the divBlock, but we need to remove the pencil icon from it.
    let cleaned = divBlock.replace(/<Button size="icon" variant="ghost"[\s\S]*?<Pencil[\s\S]*?<\/Button>/, '');
    return cleaned;
});

// Replace the Billing editing logic:
const billingRegex = /\{editingBillTotal\[bill\.id\] !== undefined \? \([\s\S]*?\) : \(\s*<>\s*(<span className="font-bold">৳\{bill\.totalAmount\}<\/span>)[\s\S]*?<\/>\s*\)\}/;
content = content.replace(billingRegex, (match, spanBlock) => {
    return spanBlock;
});

// Replace the Users Email truncation:
const usersEmailRegex = /<span className="(text-\[10px\][^\"]*truncate max-w-\[140px\])"\s+title=\{u\.email\}>/g;
content = content.replace(usersEmailRegex, '<span className="text-[11px] text-muted-foreground font-semibold leading-tight break-all" title={u.email}>');

// Wait! Also check if it's text-[11px] already or anything else.
// Let's just do a string replace for the exact line:
content = content.replace(
    'className="text-[10px] text-muted-foreground font-semibold leading-none truncate max-w-[140px]" title={u.email}>',
    'className="text-[11px] text-muted-foreground font-semibold leading-tight break-all" title={u.email}>'
);

// If it's a different variant:
content = content.replace(
    'className="text-[11px] text-muted-foreground font-semibold leading-none truncate max-w-[150px]" title={u.email}>',
    'className="text-[11px] text-muted-foreground font-semibold leading-tight break-all" title={u.email}>'
);

fs.writeFileSync(file, content);
console.log("Cleanup script V2 completed!");
