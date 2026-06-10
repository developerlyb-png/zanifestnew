import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Admin from '@/models/Admin';

export default async function handler(req : NextApiRequest, res: NextApiResponse){

    if(req.method!=='DELETE'){
        return res.status(405).json({message: 'This method is not allowed!'});
    }

    const {id} =  req.query;
    console.log("id of the admin to be deleted :", id);

    if(!id || typeof id!== 'string'){
        return res.status(400).json({message: 'Invalid ID'});
    }

    try{
        await dbConnect();

        const admin = await Admin.findByIdAndDelete(id);
        console.log("Admin findByIdAndDelete:", admin);

        if(!admin){
            return res.status(404).json({message: 'manager with this id is not in the database'});
        }

        return res.status(200).json({message: 'Admin deleted successfully'});
    }

    catch(error){

        console.error('Error deleting admin:', error);
        return res.status(500).json({message: 'Internal Server Error'});

    }
}