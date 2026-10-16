"use client";

import { KeyRound, MoreHorizontal, Plus, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, Select, Table, Td, Th, Tr } from "@/components/kit/controls";
import { PageHeader, Panel, Skeleton } from "@/components/kit/panel";
import { Pill } from "@/components/kit/status";
import { initials } from "@/components/shell/account-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { useUserMutations, useUsers } from "@/lib/queries";
import type { Role, User } from "@/lib/types";

const ROLE_TEXT: Record<Role, string> = {
  admin: "Everything, incl. users, trucks and tank calibration",
  operator: "Geofences and acknowledging alerts",
  viewer: "Read-only, can export reports",
};

export default function UsersPage() {
  const { user: me, can } = useAuth();
  const router = useRouter();
  const isAdmin = can("admin");
  const { data, isLoading } = useUsers(isAdmin);
  const { update } = useUserMutations();
  const [createOpen, setCreateOpen] = useState(false);
  const [resetFor, setResetFor] = useState<User | null>(null);

  useEffect(() => {
    if (me && !isAdmin) router.replace("/");
  }, [me, isAdmin, router]);
  if (!isAdmin) return null;

  const change = async (u: User, body: Partial<{ role: Role; is_active: boolean }>, msg: string) => {
    try {
      await update.mutateAsync({ id: u.id, ...body });
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update user");
    }
  };

  return (
    <div className="mx-auto grid max-w-[1100px] gap-5 p-4 md:p-6">
      <PageHeader
        title="Users & roles"
        description="There is no public sign-up: create accounts here. Users are deactivated, never deleted, so the activity log keeps its history."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Add user
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(ROLE_TEXT) as Role[]).map((r) => (
          <div key={r} className="rounded-xl border bg-card p-4">
            <p className="label-caps flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> {r}
            </p>
            <p className="tabular mt-1.5 font-mono text-2xl font-semibold">{data?.filter((u) => u.role === r && u.is_active).length ?? "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{ROLE_TEXT[r]}</p>
          </div>
        ))}
      </div>
      <Panel title={`${data?.length ?? 0} accounts`} bodyClassName="p-0">
        {isLoading ? (
          <div className="grid gap-2 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Last login</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => (
                <Tr key={u.id} className={u.is_active ? undefined : "opacity-60"}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-md bg-muted font-mono text-xs font-semibold">{initials(u.full_name)}</span>
                      <div>
                        <p className="font-medium">
                          {u.full_name} {u.id === me?.id && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Pill className="capitalize">{u.role}</Pill>
                  </Td>
                  <Td className="text-xs">{u.is_active ? "Active" : "Deactivated"}</Td>
                  <Td className="text-muted-foreground">{timeAgo(u.last_login_at)}</Td>
                  <Td>
                    {u.id !== me?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${u.full_name}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="label-caps py-1">Role</DropdownMenuLabel>
                          <DropdownMenuRadioGroup value={u.role} onValueChange={(v) => change(u, { role: v as Role }, `${u.full_name} is now ${v}`)}>
                            {(["admin", "operator", "viewer"] as Role[]).map((r) => (
                              <DropdownMenuRadioItem key={r} value={r} className="capitalize">
                                {r}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setResetFor(u)}>
                            <KeyRound className="mr-2 size-4" /> Reset password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => change(u, { is_active: !u.is_active }, `${u.full_name} ${u.is_active ? "deactivated" : "reactivated"}`)}
                          >
                            {u.is_active ? <UserX className="mr-2 size-4" /> : <UserCheck className="mr-2 size-4" />}
                            {u.is_active ? "Deactivate" : "Reactivate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ResetPasswordDialog user={resetFor} onClose={() => setResetFor(null)} />
    </div>
  );
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { create } = useUserMutations();
  const [form, setForm] = useState({ email: "", full_name: "", password: "", role: "viewer" as Role });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success(`${form.full_name} added`, { description: "Share the password with them securely; they can change it after logging in." });
      onOpenChange(false);
      setForm({ email: "", full_name: "", password: "", role: "viewer" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create user");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-card sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>They log in with this email and password.</DialogDescription>
          </DialogHeader>
          <Field label="Full name">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Temporary password" hint="At least 8 characters.">
            <Input type="text" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="font-mono" />
          </Field>
          <Field label="Role" hint={ROLE_TEXT[form.role]}>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="viewer">Viewer</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { update } = useUserMutations();
  const [pw, setPw] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await update.mutateAsync({ id: user.id, password: pw });
      toast.success(`Password reset for ${user.full_name}`);
      setPw("");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset password");
    }
  };
  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-xl bg-card sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>Set a new temporary password for {user?.full_name}.</DialogDescription>
          </DialogHeader>
          <Field label="New password" hint="At least 8 characters.">
            <Input type="text" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required className="font-mono" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending || pw.length < 8}>
              Reset password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
