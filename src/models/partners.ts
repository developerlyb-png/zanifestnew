import mongoose, { Schema, model, models } from 'mongoose';

interface IPartner {
  category: 'Health Insurance' | 'Motor Insurance' | 'Fire Insurance';
  heading: string;
  images: string[]; 
  
}

const partnerSchema = new Schema<IPartner>({
  category: { type: String, required: true, unique: true },
  heading: { type: String, required: true },
  images: { type: [String], default: [] },
});

const Partner = models.Partner || model<IPartner>('Partner', partnerSchema);
export default Partner;
