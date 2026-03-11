import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAdmins, removeAdmin, upsertAdmin } from "@/services/firebase-service";
import type { AdminUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { UserCog, Trash2, Edit3, ShieldCheck, User, AlertTriangle, Terminal } from "lucide-react";

export default function AdminUsers() {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit role dialog
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState("admin");
  const [editUsername, setEditUsername] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const list = await getAdmins();
      setAdmins(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (admin: AdminUser) => {
    setEditAdmin(admin);
    setEditRole(admin.role || "admin");
    setEditUsername(admin.username || "");
  };

  const handleEditSave = async () => {
    if (!editAdmin) return;
    setSaving(true);
    await upsertAdmin({ ...editAdmin, role: editRole, username: editUsername });
    await load();
    setEditAdmin(null);
    setSaving(false);
  };

  const handleRemove = async (admin: AdminUser) => {
    if (admin.uid === currentUser?.uid) {
      alert("You cannot remove your own account.");
      return;
    }
    if (!confirm(`Remove admin "${admin.username}"? They will lose admin panel access.`)) return;
    setRemovingUid(admin.uid);
    await removeAdmin(admin.uid);
    await load();
    setRemovingUid(null);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">{admins.length} admin account{admins.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Info banner */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Terminal className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-accent mb-1">How to add a new admin</p>
              <p className="text-muted-foreground">
                New admin accounts must be created via the seed script to provision both Firebase Auth and Firestore records:
              </p>
              <code className="block mt-2 bg-background rounded px-3 py-2 text-xs font-mono border border-border">
                npm run seed-admin
              </code>
              <p className="text-muted-foreground mt-2">
                Edit <span className="font-mono text-foreground">scripts/seed-admin.cjs</span> to change the username/password before running.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admins list */}
      {admins.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UserCog className="h-14 w-14 mx-auto mb-3 opacity-40" />
          <p>No admins found in the database.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {admins.map((admin) => {
            const isCurrentUser = admin.uid === currentUser?.uid;
            return (
              <Card key={admin.uid} className={`overflow-hidden ${isCurrentUser ? "border-primary/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{admin.username || "Unknown"}</span>
                        {isCurrentUser && <Badge variant="outline" className="text-[10px] text-primary border-primary/40">You</Badge>}
                        <Badge
                          className={`text-[10px] ${admin.role === "superadmin" ? "bg-amber-500/20 text-amber-400" : "bg-primary/10 text-primary"}`}
                        >
                          {admin.role === "superadmin" ? <><ShieldCheck className="h-2.5 w-2.5 mr-1" />Super Admin</> : <><User className="h-2.5 w-2.5 mr-1" />Admin</>}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{admin.email}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{admin.uid}</p>
                    </div>

                    {/* Meta */}
                    <div className="text-xs text-muted-foreground text-right hidden md:block">
                      {admin.createdAt ? (
                        <span>Created {new Date(admin.createdAt).toLocaleDateString()}</span>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(admin)} title="Edit role">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isCurrentUser ? "opacity-30 cursor-not-allowed" : "text-destructive hover:text-destructive"}
                        disabled={isCurrentUser || removingUid === admin.uid}
                        onClick={() => !isCurrentUser && handleRemove(admin)}
                        title={isCurrentUser ? "Cannot remove yourself" : "Remove admin"}
                      >
                        {removingUid === admin.uid ? <Spinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Warning */}
      {admins.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Removing an admin here only removes their Firestore record. Their Firebase Auth account remains active.
                To fully revoke access, also delete the user from the <span className="text-foreground font-medium">Firebase Console → Authentication</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editAdmin} onOpenChange={() => setEditAdmin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>Update role or display name for {editAdmin?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="username" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAdmin(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
