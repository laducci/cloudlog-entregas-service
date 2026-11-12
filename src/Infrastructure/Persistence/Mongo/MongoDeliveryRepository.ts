import { Collection, MongoClient } from "mongodb";
import { Delivery, DeliveryProps } from "../../../Domain/Delivery/Delivery";
import { DeliveryFilter, DeliveryRepository } from "../../../Domain/Ports";

type DeliveryDocument = Omit<DeliveryProps, "id"> & { _id: string };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Adaptador MongoDB Atlas (Database per Service: só este serviço acessa a coleção). */
export class MongoDeliveryRepository implements DeliveryRepository {
  private collectionPromise?: Promise<Collection<DeliveryDocument>>;

  constructor(private readonly config: { uri: string; database: string; collection: string }) {}

  private collection(): Promise<Collection<DeliveryDocument>> {
    this.collectionPromise ??= (async () => {
      const client = await new MongoClient(this.config.uri, { serverSelectionTimeoutMS: 8000 }).connect();
      const col = client.db(this.config.database).collection<DeliveryDocument>(this.config.collection);
      await col.createIndex({ code: 1 }, { unique: true });
      return col;
    })().catch((err) => {
      this.collectionPromise = undefined;
      throw err;
    });
    return this.collectionPromise;
  }

  private static toDocument(d: Delivery): DeliveryDocument {
    const { id, ...rest } = d.toPrimitives();
    return { _id: id, ...rest };
  }

  private static toEntity(doc: DeliveryDocument): Delivery {
    const { _id, ...rest } = doc;
    return Delivery.restore({ id: String(_id), ...rest });
  }

  async add(delivery: Delivery): Promise<void> {
    await (await this.collection()).insertOne(MongoDeliveryRepository.toDocument(delivery));
  }

  async save(delivery: Delivery): Promise<void> {
    const doc = MongoDeliveryRepository.toDocument(delivery);
    await (await this.collection()).replaceOne({ _id: doc._id }, doc);
  }

  async findById(id: string): Promise<Delivery | null> {
    const doc = await (await this.collection()).findOne({ _id: id });
    return doc ? MongoDeliveryRepository.toEntity(doc) : null;
  }

  async findByCode(code: string): Promise<Delivery | null> {
    const doc = await (await this.collection()).findOne({ code });
    return doc ? MongoDeliveryRepository.toEntity(doc) : null;
  }

  async list(filter: DeliveryFilter): Promise<Delivery[]> {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.search) {
      const rx = new RegExp(escapeRegex(filter.search), "i");
      query.$or = [{ code: rx }, { customer: rx }, { destination: rx }];
    }
    const docs = await (await this.collection()).find(query).sort({ createdAt: -1 }).limit(filter.limit ?? 50).toArray();
    return docs.map(MongoDeliveryRepository.toEntity);
  }

  async remove(id: string): Promise<void> {
    await (await this.collection()).deleteOne({ _id: id });
  }
}
