import * as React from "react";
import { composeRefs } from "@radix-ui/react-compose-refs";

export function useComposedRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => composeRefs(...refs), refs);
}
