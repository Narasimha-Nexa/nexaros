-- Create RecipeItem model for tracking inventory consumption per menu item
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'g',

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recipe_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
    CONSTRAINT "recipe_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE
);

CREATE INDEX "recipe_items_menu_item_id_idx" ON "recipe_items"("menu_item_id");
CREATE INDEX "recipe_items_inventory_item_id_idx" ON "recipe_items"("inventory_item_id");
CREATE UNIQUE INDEX "recipe_items_menu_item_id_inventory_item_id_key" ON "recipe_items"("menu_item_id", "inventory_item_id");
