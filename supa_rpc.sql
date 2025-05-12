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
  WHERE lunas = 1
  AND tanggal >= start_date_filter
  AND tanggal <= end_date_filter
  GROUP BY tanggal
  ORDER BY tanggal
$function$;

--supplier_harian
CREATE OR REPLACE FUNCTION supplier_harian(
  date_filter date,
  nama_filter varchar
)
RETURNS TABLE(
  supplier_nama varchar,
  harga_harian bigint, 
  hpp_harian bigint,
  total_harga_harian bigint,
  total_hpp_harian bigint
)
LANGUAGE sql
AS $function$
  SELECT supplier.nama, 
          SUM(produk_penjualan.qty * produk_penjualan.harga) AS harga_harian, 
          SUM(produk_penjualan.qty * produk_penjualan.hpp) AS hpp_harian,
          SUM(SUM(produk_penjualan.qty * produk_penjualan.harga)) OVER() AS total_harga_harian,
          SUM(SUM(produk_penjualan.qty * produk_penjualan.hpp)) OVER() AS total_hpp_harian
  FROM produk_penjualan
  JOIN penjualan ON produk_penjualan.penjualan_id = penjualan.id
  JOIN produk ON produk_penjualan.produk_id = produk.id
  JOIN supplier ON produk.supplier_id = supplier.id
  WHERE penjualan.tanggal = date_filter
  AND (nama_filter IS NULL OR supplier.nama ILIKE '%' || nama_filter || '%')
  GROUP BY supplier.nama
  ORDER BY supplier.nama
$function$;

--produk_stok_harian
CREATE OR REPLACE FUNCTION produk_stok_harian_v2(
  date_filter date, 
  nama_filter varchar, 
  kategori_filter int, 
  supplier_filter int,
  limit_filter int,
  offset_filter int
)
RETURNS TABLE(
  full_count bigint,
  id int, 
  kategori_id int, 
  nama varchar, 
  harga bigint, 
  hpp bigint, 
  supplier_nama varchar, 
  produk_stok_qty bigint, 
  produk_penjualan_qty bigint, 
  produk_penjualan_hpp bigint,
  total_produk_stok_qty bigint, 
  total_produk_penjualan_qty bigint, 
  total_produk_penjualan_hpp bigint
)
LANGUAGE sql
AS $function$
    SELECT 
      count(produk.id) OVER() AS full_count,
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
           AND penjualan.tanggal = date_filter) AS produk_penjualan_hpp,
      
      SUM( 
          (SELECT produk_stok.qty 
          FROM produk_stok 
          WHERE produk.id = produk_stok.produk_id 
            AND produk_stok.tanggal = date_filter)
      ) OVER() AS total_produk_stok_qty,
      SUM( 
          (SELECT SUM(produk_penjualan.qty) 
          FROM produk_penjualan 
          JOIN penjualan ON produk_penjualan.penjualan_id = penjualan.id 
          WHERE produk.id = produk_penjualan.produk_id 
            AND penjualan.tanggal = date_filter)
      ) OVER() AS total_produk_penjualan_qty,
      SUM( 
          (SELECT SUM(produk_penjualan.qty * produk_penjualan.hpp) 
          FROM produk_penjualan 
          JOIN penjualan ON produk_penjualan.penjualan_id = penjualan.id 
          WHERE produk.id = produk_penjualan.produk_id 
            AND penjualan.tanggal = date_filter)
      ) OVER() AS total_produk_penjualan_hpp
    FROM produk
    JOIN supplier ON produk.supplier_id = supplier.id
    WHERE 
      (kategori_filter IS NULL OR produk.kategori_id = kategori_filter)
      AND (supplier_filter IS NULL OR produk.supplier_id = supplier_filter)
      AND (nama_filter IS NULL OR produk.nama ILIKE '%' || nama_filter || '%')
    ORDER BY produk.nama
    LIMIT limit_filter
    OFFSET offset_filter
$function$;
