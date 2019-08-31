using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApplication3
{
    public class Feature
    {
        public Feature()
        {

        }

        public Feature(int id, string type, Object geometry, string properties)
        {
            //this.id = id;
            this.type = type;
            this.geometry = geometry;
            //this.properties = properties;
        }

        //public int id { get; set;}
        public string type { get; set;}
        public Object geometry { get; set;}
        //public string properties { get; set;}
    }
}