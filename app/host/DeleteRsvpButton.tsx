"use client";

import { useState, useTransition } from "react";
import { deleteRsvpAction } from "./actions";

export default function DeleteRsvpButton({ id, name }: { id: number; name: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteRsvpAction(id);
      setOpen(false);
    });
  }

  return (
    <>
      <button type="button" className="host-delete" onClick={() => setOpen(true)}>
        Remove
      </button>

      {open && (
        <div
          className="host-modal-backdrop"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="host-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="host-modal-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="host-modal-heading" className="host-modal-text">
              Remove <strong>{name}</strong>&rsquo;s RSVP? This can&rsquo;t be undone.
            </p>
            <div className="host-modal-actions">
              <button
                type="button"
                className="host-modal-cancel"
                onClick={() => setOpen(false)}
                disabled={isPending}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className="host-modal-confirm"
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
