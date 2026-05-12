import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const role = sessionStorage.getItem('aderenciaRole');
    if (role === 'admin') router.push('/admin');
    else if (role === 'participant') router.push('/participant');
    else router.push('/login');
  }, [router]);
  return null;
}
