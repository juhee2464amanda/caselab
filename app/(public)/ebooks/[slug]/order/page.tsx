import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/data/products';
import { OrderForm } from './OrderForm';

export default async function OrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getProductBySlug(slug);
  if (!book) notFound();
  return <OrderForm book={{ id: book.id, title: book.title, price: book.price }} />;
}
