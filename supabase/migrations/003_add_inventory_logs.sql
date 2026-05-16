CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL,
  cost_price DECIMAL(12, 2), -- Harga modal saat barang masuk
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk mempercepat pencarian riwayat per produk
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);

-- Aktifkan RLS
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang bisa melihat dan menambah log inventori
CREATE POLICY "Admins can do everything on inventory_logs" ON inventory_logs
USING (is_admin());
