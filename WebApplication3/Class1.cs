
public class Rootobject
{
    public string type { get; set; }
    public Crs crs { get; set; }
    public Feature[] features { get; set; }
}

public class Crs
{
    public string type { get; set; }
    public Properties properties { get; set; }
}

public class Properties
{
    public string name { get; set; }
}

public class Feature
{
    public string type { get; set; }
    public Geometry geometry { get; set; }
}

public class Geometry
{
    public string type { get; set; }
    public object[] coordinates { get; set; }
    public Geometry1[] geometries { get; set; }
}

public class Geometry1
{
    public string type { get; set; }
    public object[] coordinates { get; set; }
}