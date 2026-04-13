"use client";

import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Check, X, PackageOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addPantryItem } from "@/actions/add-pantry-item";
import { updatePantryItem } from "@/actions/update-pantry-item";
import { deletePantryItem } from "@/actions/delete-pantry-item";
import type { PantryItem } from "@/actions/get-pantry-items";

interface PantryListProps {
  initialItems: PantryItem[];
}

export function PantryList({ initialItems }: PantryListProps) {
  const [items, setItems] = useState<PantryItem[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError("Ingredient name is required");
      return;
    }

    setAddError(null);
    setIsAdding(true);

    const result = await addPantryItem(trimmed);

    if ("error" in result) {
      setAddError(result.error);
      setIsAdding(false);
      return;
    }

    setItems((prev) =>
      [...prev, { id: result.item.id, name: result.item.name, createdAt: new Date() }].sort(
        (a, b) => a.name.localeCompare(b.name)
      )
    );
    setNewName("");
    setIsAdding(false);
    inputRef.current?.focus();
  }

  function handleStartEdit(item: PantryItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditError(null);
  }

  async function handleSaveEdit(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Ingredient name is required");
      return;
    }

    setEditError(null);
    const result = await updatePantryItem(id, trimmed);

    if ("error" in result) {
      setEditError(result.error);
      return;
    }

    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, name: result.item.name } : item
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditingId(null);
    setEditName("");
  }

  async function handleDelete(id: string) {
    const result = await deletePantryItem(id);

    if ("error" in result) {
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  // Empty state
  if (items.length === 0 && !newName && !addError) {
    return (
      <div className="space-y-6">
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center"
          data-testid="empty-state"
        >
          <PackageOpen className="mb-4 size-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">Your pantry is empty</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add your first ingredient to get started. Your pantry ingredients can
            be used when generating recipes.
          </p>
        </div>

        {/* Add form always available */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Add an ingredient..."
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (addError) setAddError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAdding) handleAdd();
            }}
            data-testid="add-ingredient-input"
          />
          <Button
            onClick={handleAdd}
            disabled={isAdding}
            data-testid="add-ingredient-button"
          >
            <Plus className="mr-1 size-4" />
            Add
          </Button>
        </div>
        {addError && (
          <p className="text-sm text-destructive" data-testid="add-error">
            {addError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add ingredient form */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Add an ingredient..."
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            if (addError) setAddError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isAdding) handleAdd();
          }}
          data-testid="add-ingredient-input"
        />
        <Button
          onClick={handleAdd}
          disabled={isAdding}
          data-testid="add-ingredient-button"
        >
          <Plus className="mr-1 size-4" />
          Add
        </Button>
      </div>
      {addError && (
        <p className="text-sm text-destructive" data-testid="add-error">
          {addError}
        </p>
      )}

      {/* Ingredient list */}
      <ul className="divide-y rounded-lg border" data-testid="pantry-list">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 px-4 py-3"
            data-testid={`pantry-item-${item.id}`}
          >
            {editingId === item.id ? (
              <>
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editError) setEditError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(item.id);
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="flex-1"
                  autoFocus
                  data-testid="edit-ingredient-input"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSaveEdit(item.id)}
                  data-testid="save-edit-button"
                  aria-label="Save"
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelEdit}
                  data-testid="cancel-edit-button"
                  aria-label="Cancel"
                >
                  <X className="size-4" />
                </Button>
                {editError && (
                  <p
                    className="text-sm text-destructive"
                    data-testid="edit-error"
                  >
                    {editError}
                  </p>
                )}
              </>
            ) : (
              <>
                <span className="flex-1" data-testid="item-name">
                  {item.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStartEdit(item)}
                  data-testid={`edit-button-${item.id}`}
                  aria-label={`Edit ${item.name}`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  data-testid={`delete-button-${item.id}`}
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
