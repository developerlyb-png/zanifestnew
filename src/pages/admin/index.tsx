// pages/admin.tsx

import { GetServerSideProps } from 'next';
import { verifyToken } from '@/utils/verifyToken';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies['admin-token'];
  const data = token ? verifyToken(token) : null;

  if (
    !data ||
    typeof data !== 'object' ||
    data === null ||
    !('role' in data) ||
    (data as any).role !== 'admin'
  ) {
    return {
      redirect: {
        destination: '/adminlogin',
        permanent: false,
      },
    };
  }

  return { props: { adminData: data } };
};

// ✅ Default React Component
export default function AdminPage({ adminData }: { adminData: any }) {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Welcome Admin: {adminData?.userName}</h1>
      {/* Add more content here */}
    </div>
  );
}
