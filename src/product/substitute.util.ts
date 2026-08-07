type ProductClient = {
  product: {
    findUnique: (args: any) => Promise<{ substituteId: string | null } | null>;
    update: (args: any) => Promise<any>;
  };
};

export async function syncSubstitute(
  client: ProductClient,
  productId: string,
  mainEnabled: boolean,
) {
  const product = await client.product.findUnique({
    where: { id: productId },
    select: { substituteId: true },
  });

  if (!product?.substituteId) return;

  await client.product.update({
    where: { id: product.substituteId },
    data: { isEnabled: !mainEnabled },
  });
}
