import { Suspense } from "react";
import QRShare from "../components/QRShare";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando QRShare...</div>}>
      <QRShare />
    </Suspense>
  );
}
