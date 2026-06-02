import { redirect } from 'next/navigation';

export default function MypageRoot() {
  redirect('/mypage/profile');
}
