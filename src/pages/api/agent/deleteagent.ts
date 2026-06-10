import {NextApiRequest, NextApiResponse} from 'next';
import dbConnect from '@/lib/dbConnect';
import Agent from '@/models/Agent';

export default async function handler(req: NextApiRequest, res: NextApiResponse){

    if(req.method!=='DELETE'){
        return res.status(405).json({message: 'invalid method call'});
    }

    const { id} = req.query;
    console.log("the id of teh agent to be deleted : ", id);

    try{
        await dbConnect();

        const agent = await Agent.findByIdAndDelete(id);

        if(!agent){
            return res.status(404).json({message: 'this agent with this id is not in the db'});
        }
        console.log("the agent found and deleted is : ", agent);

        return res.status(200).json({ success: true, message: 'Agent deleted successfully', agent });

    }

    catch(err){
        console.log("error in deleting the agent : ", err);
        return res.status(500).json({message: 'internal server error'});
    }
}