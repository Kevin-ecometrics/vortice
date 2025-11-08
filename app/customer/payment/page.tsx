import { Suspense } from "react";
import Payment from "../components/Payment";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando Pago...</div>}>
      <Payment />
    </Suspense>
  );
}
