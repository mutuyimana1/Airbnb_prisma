export interface Listing{
    id:number;
    title:string;
    description:string;
    location:string;
}
export const listings:Listing[]=[
    {id:1,title:'Alice',description:'Alice is a great user',location:'New York'},
    {id:2,title:'Bob',description:'Bob is a great user',location:'Los Angeles'}
]