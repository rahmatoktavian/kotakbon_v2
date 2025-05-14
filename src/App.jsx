import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router";

import { supabase } from './config/supabase'
import AppLayout from "./AppLayout";

import TrxInput from "./pages/trx/TrxInput";
import TrxList from "./pages/trx/TrxList";
import TrxDetail from "./pages/trx/TrxDetail";

import LapSupplierHarian from "./pages/lap/LapSupplierHarian";
import LapStokHarian from "./pages/lap/LapStokHarian";
import LapPenjualanHarian from "./pages/lap/LapPenjualanHarian";

import SetStokAwal from "./pages/set/SetStokAwal";
import SetProduk from "./pages/set/SetProduk";
import SetSupplier from "./pages/set/SetSupplier";
import SetKategori from "./pages/set/SetKategori";

import AuthLogin from "./pages/auth/AuthLogin";
import AuthResetPass from "./pages/auth/AuthResetPass";

const basename = "/kotakbon_v2";

const App = () => {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // not login
  if (!session) {
    return (
      <AuthLogin />
    )

  // logged
  } else {
    return (
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<TrxInput />} />
              <Route path="/trxlist" element={<TrxList />} />
              <Route path="/trxdetail/:id" element={<TrxDetail />} />

              <Route path="/lapstokharian" element={<LapStokHarian />} />
              <Route path="/lapsupplierharian" element={<LapSupplierHarian />} />
              <Route path="/lappenjualanharian" element={<LapPenjualanHarian />} />

              <Route path="/setstokawal" element={<SetStokAwal />} />
              <Route path="/setproduk" element={<SetProduk />} />
              <Route index path="/setsupplier" element={<SetSupplier />} />
              <Route path="/setkategori" element={<SetKategori />} />

              <Route path="/authresetpass" element={<AuthResetPass />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )
    }
    //end logged
};
export default App;