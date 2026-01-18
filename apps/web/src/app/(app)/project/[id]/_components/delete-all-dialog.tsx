import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import React from "react";

interface DeleteAllDialogProps {
  dialogOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onDeleteAll: () => void;
}

export default function DeleteAllDialog({
  dialogOpen,
  setOpen,
  onDeleteAll,
}: DeleteAllDialogProps) {
  return (
    <>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px] gap-4 px-6 py-5 overflow-hidden border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl">
          <DialogHeader className="border-b border-border/40">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Are you sure you want to delete ALL of your changes?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              This action CANNOT be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onDeleteAll();
                  setOpen(false);
                }}
                className="hover:text-red-500"
                variant="ghost"
              >
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
