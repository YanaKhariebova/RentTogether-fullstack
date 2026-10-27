import assert from "node:assert/strict";
import { test } from "node:test";
import {
  itemFormSchema,
  itemImageFileSchema,
  MAX_IMAGE_SIZE_BYTES,
  priceFieldSchema,
} from "./itemFormSchema.ts";

const validForm = {
  title: "  Beamer für einen Filmabend  ",
  description: "Ein Beamer mit HDMI-Anschluss.",
  city: "Berlin",
  categoryId: "mock-electronics",
  pricePerDay: "15,50",
  images: [{ kind: "local", id: "photo-1", file: new File(["test"], "photo.png", { type: "image/png" }) }],
};

test("цена переводится в центы без ошибок дробной арифметики", () => {
  for (const [input, expected] of [["15,50", 1550], ["15.5", 1550], ["15", 1500], ["0,29", 29], ["0.01", 1]]) {
    assert.equal(priceFieldSchema.parse(input), expected);
  }
});

test("нулевые, отрицательные и неоднозначные цены отклоняются", () => {
  for (const input of ["", "0", "0,00", "-1", "1.234", "1,2,3", "1e2", "Infinity", "1000000"]) {
    assert.equal(priceFieldSchema.safeParse(input).success, false, input);
  }
});

test("форма проверяет обязательные поля и убирает пробелы по краям", () => {
  assert.equal(itemFormSchema.parse(validForm).title, "Beamer für einen Filmabend");
  for (const field of ["title", "description", "city", "categoryId"]) {
    assert.equal(itemFormSchema.safeParse({ ...validForm, [field]: "  " }).success, false, field);
  }
});

test("нужно от одного до восьми фото с уникальными id", () => {
  assert.equal(itemFormSchema.safeParse({ ...validForm, images: [] }).success, false);
  assert.equal(itemFormSchema.safeParse({ ...validForm, images: Array.from({ length: 9 }, (_, i) => ({ ...validForm.images[0], id: String(i) })) }).success, false);
  assert.equal(itemFormSchema.safeParse({ ...validForm, images: [validForm.images[0], validForm.images[0]] }).success, false);
});

test("файл проверяется на тип, пустое содержимое и максимальный размер", () => {
  assert.equal(itemImageFileSchema.safeParse(new File(["text"], "image.png", { type: "text/plain" })).success, false);
  assert.equal(itemImageFileSchema.safeParse(new File([], "empty.png", { type: "image/png" })).success, false);
  assert.equal(itemImageFileSchema.safeParse(new File([new Uint8Array(MAX_IMAGE_SIZE_BYTES + 1)], "large.png", { type: "image/png" })).success, false);
  assert.equal(itemImageFileSchema.safeParse(new File([new Uint8Array(MAX_IMAGE_SIZE_BYTES)], "limit.png", { type: "image/png" })).success, true);
});

test("при редактировании можно сохранить уже загруженное фото", () => {
  const images = [{ kind: "stored", id: "saved-photo", url: "/uploads/photo.webp" }];
  assert.equal(itemFormSchema.safeParse({ ...validForm, images }).success, true);
});
