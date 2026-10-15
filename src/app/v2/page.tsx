import { redirect } from 'next/navigation';

/** /v2 is being rebuilt from scratch (docs/v2-realistic-3d-brief.md). Until then it points at /. */
export default function V2Page(): never {
    redirect('/');
}
