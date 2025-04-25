import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router";

import AppLayout from "./AppLayout";

import TrxInput from "./pages/trx/TrxInput";
import TrxList from "./pages/trx/TrxList";

import LapPenjualanHarian from "./pages/lap/LapPenjualanHarian";
import LapStokHarian from "./pages/lap/LapStokHarian";

import SetStokProduk from "./pages/set/SetStokProduk";
import SetProduk from "./pages/set/SetProduk";
import SetSupplier from "./pages/set/SetSupplier";
import SetKategori from "./pages/set/SetKategori";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route path="/trxinput" element={<TrxInput />} />
          <Route path="/trxlist" element={<TrxList />} />

          <Route path="/lappenjualanharian" element={<LapPenjualanHarian />} />
          <Route path="/lapstokharian" element={<LapStokHarian />} />

          <Route path="/SetStokProduk" element={<SetStokProduk />} />
          <Route path="/setproduk" element={<SetProduk />} />
          <Route index path="/setsupplier" element={<SetSupplier />} />
          <Route path="/setkategori" element={<SetKategori />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
};
export default App;