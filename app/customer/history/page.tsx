import { Suspense } from "react";
import History from "../components/History";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando History...</div>}>
      <History />
    </Suspense>
  );
}
