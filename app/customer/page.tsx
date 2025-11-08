import { Suspense } from "react";
import Customer from "./components/CustomerPage";

export default function HistoryPage() {
  return (
    <Suspense fallback={<div>Cargando CustomerPage...</div>}>
      <Customer />
    </Suspense>
  );
}
