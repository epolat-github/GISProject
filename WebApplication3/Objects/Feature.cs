using System;

namespace WebApplication3
{
    public class Feature
    {
        public Feature()
        {

        }

        public Feature(int id, string type, Object geometry)
        {
            this.id = id;
            this.type = type;
            this.geometry = geometry;
        }

        public int id { get; set; }
        public string type { get; set; }
        public Object geometry { get; set; }
    }
}