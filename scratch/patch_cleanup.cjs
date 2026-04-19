const fs = require('fs');
const file = 'f:/baust-tea-hub-main/baust-tea-hub-main/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

function replaceStr(str, findStr, replaceWith) {
  const i1 = str.indexOf(findStr);
  if (i1 === -1) {
    console.log("Could not find:", findStr.substring(0, 50));
    return str;
  }
  return str.substring(0, i1) + replaceWith + str.substring(i1 + findStr.length);
}

const ordersTarget = `{editingOrderTotal[order.id] !== undefined ? (
                         <div className="flex items-center gap-1 bg-primary/10 pl-1 pr-1 py-1 rounded-xl border border-primary/20 shadow-sm">
                            <span className="font-black text-sm text-primary ml-2">৳</span>
                            <Input autoFocus type="number" className="w-16 h-7 text-xs font-bold text-primary px-1" value={editingOrderTotal[order.id]} onChange={e => setEditingOrderTotal({...editingOrderTotal, [order.id]: e.target.value})} />
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-md" onClick={() => {
                               const newT = Number(editingOrderTotal[order.id]);
                               if (!isNaN(newT) && newT >= 0) updateOrderTotal(order.id, newT);
                               const newEditing = {...editingOrderTotal}; delete newEditing[order.id]; setEditingOrderTotal(newEditing);
                            }}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-600 hover:text-white hover:bg-rose-600 rounded-md" onClick={() => {
                               const newEditing = {...editingOrderTotal}; delete newEditing[order.id]; setEditingOrderTotal(newEditing);
                            }}><X className="h-4 w-4" /></Button>
                         </div>
                      ) : (
                         <div className="flex items-center gap-2 bg-primary/10 px-3.5 py-2 rounded-xl border border-primary/20 shadow-sm hover:bg-primary/20 transition-colors">
                            <span className="font-black text-sm text-primary tracking-tight">৳{order.total}</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full opacity-50 hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground" onClick={() => setEditingOrderTotal({...editingOrderTotal, [order.id]: String(order.total)})}>
                               <Pencil className="h-3 w-3" />
                            </Button>
                         </div>
                      )}`;

const ordersReplacement = `<div className="flex items-center gap-2 bg-primary/10 px-3.5 py-2 rounded-xl border border-primary/20 shadow-sm transition-colors">
                            <span className="font-black text-sm text-primary tracking-tight">৳{order.total}</span>
                         </div>`;


const billingTarget = `{editingBillTotal[bill.id] !== undefined ? (
                             <>
                                <Input autoFocus type="number" className="w-16 h-6 text-[10px] font-bold px-1" value={editingBillTotal[bill.id]} onChange={e => setEditingBillTotal({...editingBillTotal, [bill.id]: e.target.value})} />
                                <Button size="icon" variant="ghost" className="h-5 w-5 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded" onClick={() => {
                                   const newT = Number(editingBillTotal[bill.id]);
                                   if (!isNaN(newT) && newT >= 0) updateBillTotal(bill.id, newT);
                                   const newEditing = {...editingBillTotal}; delete newEditing[bill.id]; setEditingBillTotal(newEditing);
                                }}><Check className="h-3 w-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-5 w-5 text-rose-600 hover:text-white hover:bg-rose-600 rounded" onClick={() => {
                                   const newEditing = {...editingBillTotal}; delete newEditing[bill.id]; setEditingBillTotal(newEditing);
                                }}><X className="h-3 w-3" /></Button>
                             </>
                          ) : (
                             <>
                                <span className="font-bold">৳{bill.totalAmount}</span>
                                <Button size="icon" variant="ghost" className="h-5 w-5 rounded opacity-50 hover:opacity-100 text-muted-foreground hover:text-foreground transition-all ml-1 hover:bg-muted" onClick={() => setEditingBillTotal({...editingBillTotal, [bill.id]: String(bill.totalAmount)})}>
                                   <Pencil className="h-2.5 w-2.5" />
                                </Button>
                             </>
                          )}`;

const billingReplacement = `<span className="font-bold">৳{bill.totalAmount}</span>`;


const usersEmailTarget = `                      <span className="text-[10px] text-muted-foreground font-semibold leading-none truncate max-w-[140px]" title={u.email}>
                         {u.email}
                      </span>`;

const usersEmailReplacement = `                      <span className="text-[11px] text-muted-foreground font-semibold leading-tight break-all" title={u.email}>
                         {u.email}
                      </span>`;

content = replaceStr(content, ordersTarget, ordersReplacement);
content = replaceStr(content, billingTarget, billingReplacement);
content = replaceStr(content, usersEmailTarget, usersEmailReplacement);

fs.writeFileSync(file, content);
console.log("Cleanup script completed!");
