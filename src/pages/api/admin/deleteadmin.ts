import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Admin from '@/models/Admin';
import { verifyToken } from '@/utils/verifyToken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'This method is not allowed!' });
    }

    const token = req.cookies['adminToken'];
    const data = token ? await verifyToken(token) : null;

    if (
        !data ||
        typeof data !== 'object' ||
        !('role' in data) ||
        (data as any).role !== 'superadmin'
    ) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (id === (data as any).id) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    try {
        await dbConnect();

        const admin = await Admin.findByIdAndDelete(id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin with this id is not in the database' });
        }

        return res.status(200).json({ message: 'Admin deleted successfully' });
    }

    catch (error) {
        console.error('Error deleting admin:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
