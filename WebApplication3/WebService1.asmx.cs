using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Services;
using Newtonsoft.Json;
using Npgsql;

namespace WebApplication3
{
    /// <summary>
    /// Summary description for WebService1
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    [System.ComponentModel.ToolboxItem(false)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
    [System.Web.Script.Services.ScriptService]
    public class WebService1 : System.Web.Services.WebService
    {

        private NpgsqlConnection connectDB()
        {
            string options = "Host=localhost;Port=5432;Database=openLayersProject;" +
                "Username=postgres;Password=aassddff";

            NpgsqlConnection connection = new NpgsqlConnection(options);

            return connection;
        }

        [WebMethod]
        public void addFeature(string feature)
        {
            NpgsqlConnection conn = connectDB();
            Feature featured = JsonConvert.DeserializeObject<Feature>(feature);

            conn.Open();

            string insertQuery = $"INSERT INTO public.\"FEATURES\" (type, geom) VALUES" +
                $" ('{featured.type}', " +
                $"ST_GeomFromGeoJSON('{featured.geometry}'))";

            NpgsqlCommand command = new NpgsqlCommand(insertQuery, conn);
            command.ExecuteNonQuery();
            conn.Close();
        }

        [WebMethod]
        public void updateFeature(string feature)
        {
            NpgsqlConnection conn = connectDB();
            Feature featured = JsonConvert.DeserializeObject<Feature>(feature);

            conn.Open();

            string updateQuery = $"UPDATE public.\"FEATURES\" SET geom = " +
            $"ST_GeomFromGeoJSON('{featured.geometry}') WHERE gid = {featured.id}"; //updates just GEOMETRY attr.

            

            NpgsqlCommand command = new NpgsqlCommand(updateQuery, conn);
            int row = command.ExecuteNonQuery();
            conn.Close();

        }

        [WebMethod]
        public void deleteFeature(int id)
        {
            NpgsqlConnection conn = connectDB();

            conn.Open();

            string deleteQuery = $"DELETE FROM public.\"FEATURES\" " +
                $"WHERE gid = {id}";

            NpgsqlCommand command = new NpgsqlCommand(deleteQuery, conn);
            command.ExecuteNonQuery();
            conn.Close();

        }

        [WebMethod]
        public void addAdditionalInfo(string id, string name, string type, string comment)
        {
            int idInt = int.Parse(id);

            NpgsqlConnection conn = connectDB();
            conn.Open();

            //string updateQuery = $"UPDATE public.additional_information SET \"name\"='{name}', " +
            //    $"\"type\"='{type}', \"comment\"='{comment}' " +
            //    $"WHERE gid={id}";

            string insertQuery = "INSERT INTO public.additional_information" +
                "(gid, \"name\", \"type\", \"comment\")" +
                $"VALUES({idInt}, '{name}', '{type}', '{comment}') " +
                $"ON CONFLICT (gid) DO UPDATE " +
                $"SET \"name\" = excluded.name, \"type\" = excluded.type, " +
                $"\"comment\" = excluded.comment;";

            NpgsqlCommand command = new NpgsqlCommand(insertQuery, conn);

            command.ExecuteNonQuery();
           
            conn.Close();
        }

        [WebMethod]
        public void deleteAdditionalInfo(int id)
        {

            NpgsqlConnection conn = connectDB();
            conn.Open();
            string deleteQuery = "DELETE FROM public.additional_information WHERE gid=" + id;

            NpgsqlCommand command = new NpgsqlCommand(deleteQuery, conn);
            command.ExecuteNonQuery();

            conn.Close();
        }

        [WebMethod]
        public string getAdditionalInfo(int id)
        {
            NpgsqlConnection conn = connectDB();
            ArrayList infoList = new ArrayList();

            conn.Open();
            string selectQuery = "select info.name, info.\"type\", info.\"comment\" " +
                                "from public.additional_information as info " +
                                "where gid=" + id;
            NpgsqlCommand command = new NpgsqlCommand(selectQuery, conn);
            NpgsqlDataReader dr = command.ExecuteReader();

            while (dr.Read())
            {
                infoList.Add(dr[0].ToString()); //name
                infoList.Add(dr[1].ToString()); //type
                infoList.Add(dr[2].ToString()); //comment
            }
            conn.Close();

            var infoJson = JsonConvert.SerializeObject(infoList);
            return infoJson;
        }

        [WebMethod]
        public ArrayList startMap()
        {
            NpgsqlConnection conn = connectDB();
            Feature feature;
            ArrayList featuresList = new ArrayList();

            conn.Open();
            string selectQuery = "SELECT gid, type, ST_AsGeoJSON(geom), properties " +
                "FROM public.\"FEATURES\"";

            NpgsqlCommand command = new NpgsqlCommand(selectQuery, conn);
            NpgsqlDataReader dr = command.ExecuteReader();

            while (dr.Read())
            {
                int id = (int)dr[0];
                string type = dr[1].ToString();
                Object geom = dr[2];
                string prop = dr[3].ToString();

                feature = new Feature(id, type, geom, prop);
                //featuresList.Add(JsonConvert.SerializeObject(feature));
                featuresList.Add(feature);
            }
            conn.Close();

            return featuresList;
        }

        [WebMethod]
        public void clearMap()
        {
            NpgsqlConnection conn = connectDB();
            conn.Open();
            string truncateQuery = "TRUNCATE public.\"FEATURES\" RESTART IDENTITY";

            NpgsqlCommand command = new NpgsqlCommand(truncateQuery, conn);
            command.ExecuteNonQuery();
            conn.Close();

        }

    }
}
