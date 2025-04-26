--lap_penjualan_harian
CREATE OR REPLACE FUNCTION lap_penjualan_harian(
  start_date_filter date, 
  end_date_filter date
)
RETURNS TABLE(
  tanggal date, 
  total_harga_harian bigint, 
  total_hpp_harian bigint, 
  nominal_bayar_harian bigint, 
  nominal_kembalian_harian bigint
)
LANGUAGE sql
AS $function$
  SELECT tanggal, SUM(total_harga) AS total_harga_harian, SUM(total_hpp) AS total_hpp_harian
          , SUM(nominal_bayar) AS nominal_bayar_harian, SUM(nominal_kembalian) AS nominal_kembalian_harian
  FROM penjualan
  WHERE tanggal >= start_date_filter
  AND tanggal <= end_date_filter
  GROUP BY tanggal
  ORDER BY tanggal
$function$;


--lap_stok_harian
CREATE OR REPLACE FUNCTION lap_stok_harian(
  date_filter date, 
  nama_filter varchar, 
  kategori_filter int, 
  supplier_filter int
)
RETURNS TABLE(
  id int, 
  kategori_id int, 
  nama varchar, 
  harga bigint, 
  hpp bigint, 
  supplier_nama varchar, 
  produk_stok_qty bigint, 
  produk_penjualan_qty bigint, 
  produk_penjualan_hpp bigint
)
LANGUAGE sql
AS $function$
    SELECT 
      produk.id, 
      produk.kategori_id, 
      produk.nama, 
      produk.harga, 
      produk.hpp, 
      supplier.nama AS supplier_nama,
      (SELECT produk_stok.qty 
         FROM produk_stok 
         WHERE produk.id = produk_stok.produk_id 
           AND produk_stok.tanggal = date_filter) AS produk_stok_qty,
      (SELECT SUM(produk_penjualan.qty) 
         FROM produk_penjualan 
         JOIN penjualan ON produk_penjualan.penjualan_id = penjualan.id 
         WHERE produk.id = produk_penjualan.produk_id 
           AND penjualan.tanggal = date_filter) AS produk_penjualan_qty,
      (SELECT SUM(produk_penjualan.qty * produk_penjualan.hpp) 
         FROM produk_penjualan 
         JOIN penjualan ON produk_penjualan.penjualan_id = penjualan.id 
         WHERE produk.id = produk_penjualan.produk_id 
           AND penjualan.tanggal = date_filter) AS produk_penjualan_hpp
    FROM produk
    JOIN supplier ON produk.supplier_id = supplier.id
    WHERE 
      (kategori_filter IS NULL OR produk.kategori_id = kategori_filter)
      AND (supplier_filter IS NULL OR produk.supplier_id = supplier_filter)
      AND (nama_filter IS NULL OR produk.nama ILIKE '%' || nama_filter || '%')
    ORDER BY produk.nama
$function$;
