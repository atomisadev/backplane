"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { SetStateAction } from "react";

export default function RemoveTableDialog({
  open: isDialogOpen,
  setOpen,
  handleDeleteTable,
}: {
  open: boolean;
  setOpen: React.Dispatch<SetStateAction<boolean>>;
  handleDeleteTable: () => void;
}) {
  const handleDelete = () => {
    handleDeleteTable();
    setOpen(false);
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This change is only local, it will
            persist if you click "Public to DB";
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleDelete}>
            Delete table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
