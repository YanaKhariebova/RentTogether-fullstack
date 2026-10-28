import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMockItem, unpublishMockItem } from "./mockItemChanges.ts";
import { itemFormSchema } from "./itemFormSchema.ts";

const categories = [{ id: "electronics", name: "Elektronik" }];
const owner = { id: "olga", name: "Olga", city: "Berlin" };
const images = [{ id: "photo", url: "/test-photo.png", order: 0 }];
const form = itemFormSchema.parse({
  title: "Beamer für einen Filmabend", description: "Ein Beamer mit HDMI-Anschluss.",
  city: "Berlin", categoryId: "electronics", pricePerDay: "15,50",
  images: [{ kind: "stored", id: "photo", url: "/test-photo.png" }],
});
const firstDate = "2026-10-28T08:00:00.000Z";
const nextDate = "2026-10-28T09:00:00.000Z";

test("локальное создание соблюдает согласованный формат цены и владельца", () => {
  const item = buildMockItem(form, categories, owner, images, "item", firstDate);
  assert.equal(item.pricePerDay, "15.50");
  assert.deepEqual(item.owner, owner);
  assert.equal(item.isPublished, true);
  assert.equal(item.createdAt, firstDate);
  assert.equal(item.updatedAt, firstDate);
  assert.equal("categoryId" in item, false);
});

test("редактирование сохраняет дату создания и статус скрытого объявления", () => {
  const original = { ...buildMockItem(form, categories, owner, images, "item", firstDate), isPublished: false };
  const updated = buildMockItem({ ...form, title: "Neuer Titel" }, categories, owner, images, "item", nextDate, original);
  assert.equal(updated.title, "Neuer Titel");
  assert.equal(updated.createdAt, firstDate);
  assert.equal(updated.updatedAt, nextDate);
  assert.equal(updated.isPublished, false);
  assert.equal(original.title, form.title);
});

test("снятие с публикации сохраняет объявление, фото и остальные записи", () => {
  const item = buildMockItem(form, categories, owner, images, "item", firstDate);
  const other = { ...item, id: "other" };
  const result = unpublishMockItem([item, other], "item", nextDate);
  assert.equal(result.length, 2);
  assert.equal(result[0].isPublished, false);
  assert.equal(result[0].updatedAt, nextDate);
  assert.deepEqual(result[0].images, images);
  assert.equal(result[1], other);
  assert.equal(item.isPublished, true);
});

test("неизвестная категория не создаёт несогласованные mock-данные", () => {
  assert.throws(() => buildMockItem({ ...form, categoryId: "unknown" }, categories, owner, images, "item", firstDate));
});
